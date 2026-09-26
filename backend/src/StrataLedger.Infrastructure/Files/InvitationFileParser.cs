using System.Globalization;
using ClosedXML.Excel;
using CsvHelper;
using CsvHelper.Configuration;
using StrataLedger.Application.Common.Services;

namespace StrataLedger.Infrastructure.Files;

/// <summary>
/// Reads invitation lists from CSV or XLSX. Headers are matched case-insensitively and loosely
/// ("First Name", "first_name", "firstname"). Cell values are stripped of spreadsheet-formula prefixes.
/// </summary>
public sealed class InvitationFileParser : IInvitationFileParser
{
    private const int MaxRows = 5_000;

    private static readonly Dictionary<string, string[]> HeaderAliases = new()
    {
        ["email"] = ["email", "emailaddress", "e-mail"],
        ["firstname"] = ["firstname", "first", "givenname"],
        ["lastname"] = ["lastname", "last", "surname", "familyname"],
        ["role"] = ["role", "userrole", "type"],
        ["plan"] = ["plan", "plannumber", "strataplan", "planno"],
        ["lot"] = ["lot", "lotnumber", "lotno"],
    };

    private static readonly Dictionary<string, Func<Stream, CancellationToken, Task<List<Dictionary<string, string>>>>> Readers =
        new(StringComparer.OrdinalIgnoreCase)
        {
            [".csv"] = ReadCsvAsync,
            [".xlsx"] = (s, _) => Task.FromResult(ReadXlsx(s)),
        };

    public async Task<IReadOnlyList<InvitationFileRow>> ParseAsync(Stream content, string fileName, CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(fileName);
        if (!Readers.TryGetValue(extension, out var reader))
        {
            throw new InvalidDataException("Only .csv and .xlsx files are supported.");
        }

        var records = await reader(content, cancellationToken);
        return records.Take(MaxRows).Select((r, i) => new InvitationFileRow(
            i + 2,
            Get(r, "email"), Get(r, "firstname"), Get(r, "lastname"), Get(r, "role"),
            NullIfEmpty(Get(r, "plan")), NullIfEmpty(Get(r, "lot")))).ToList();
    }

    private static async Task<List<Dictionary<string, string>>> ReadCsvAsync(Stream stream, CancellationToken ct)
    {
        using var reader = new StreamReader(stream);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            MissingFieldFound = null,
            BadDataFound = null,
            TrimOptions = TrimOptions.Trim,
        });

        await csv.ReadAsync();
        csv.ReadHeader();
        var headers = csv.HeaderRecord ?? [];
        var rows = new List<Dictionary<string, string>>();
        while (await csv.ReadAsync() && rows.Count < MaxRows)
        {
            ct.ThrowIfCancellationRequested();
            rows.Add(headers.Select((h, i) => (Key: Canonical(h), Value: csv.GetField(i) ?? string.Empty))
                .Where(x => x.Key is not null)
                .GroupBy(x => x.Key!)
                .ToDictionary(g => g.Key, g => g.First().Value));
        }

        return rows;
    }

    private static List<Dictionary<string, string>> ReadXlsx(Stream stream)
    {
        using var workbook = new XLWorkbook(stream);
        var sheet = workbook.Worksheets.First();
        var used = sheet.RangeUsed();
        if (used is null)
        {
            return [];
        }

        var headerRow = used.FirstRow();
        var columns = headerRow.Cells()
            .Select(c => (Column: c.Address.ColumnNumber, Key: Canonical(c.GetString())))
            .Where(x => x.Key is not null)
            .ToList();

        return used.RowsUsed().Skip(1).Take(MaxRows)
            .Select(row => columns.GroupBy(c => c.Key!)
                .ToDictionary(g => g.Key, g => row.Cell(g.First().Column - used.FirstColumn().ColumnNumber() + 1).GetString()))
            .ToList();
    }

    private static string? Canonical(string header)
    {
        var normalized = new string(header.Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();
        return HeaderAliases.FirstOrDefault(kv => kv.Value.Contains(normalized)).Key;
    }

    private static string Get(Dictionary<string, string> row, string key) =>
        Sanitize(row.GetValueOrDefault(key) ?? string.Empty);

    /// <summary>Neutralises CSV-injection payloads (=, +, -, @) that could execute if data is re-exported.</summary>
    private static string Sanitize(string value) => value.Trim().TrimStart('=', '+', '@', '\t', '\r').Trim();

    private static string? NullIfEmpty(string value) => string.IsNullOrWhiteSpace(value) ? null : value;
}
