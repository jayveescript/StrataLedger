using StrataLedger.Domain.Enums;
using StrataLedger.Domain.Strata;

namespace StrataLedger.UnitTests.Domain;

public sealed class LotTests
{
    private static Lot NewLot() => Lot.Create(Guid.NewGuid(), Guid.NewGuid(), "Lot 1", "101", 1, LotType.Apartment, 10);

    [Fact]
    public void Assigning_an_owner_occupies_a_vacant_lot()
    {
        var lot = NewLot();
        lot.AssignOwner(Guid.NewGuid(), 100);
        Assert.Equal(LotStatus.Occupied, lot.Status);
        Assert.Equal(0, lot.UnallocatedShare);
    }

    [Fact]
    public void Remaining_share_is_never_over_allocated()
    {
        var lot = NewLot();
        lot.AssignOwner(Guid.NewGuid(), 60);

        Assert.True(lot.AssignRemainingShare(Guid.NewGuid()));
        Assert.Equal(40, lot.Ownerships[1].SharePercent);
        Assert.False(lot.AssignRemainingShare(Guid.NewGuid()));
        Assert.Equal(100, lot.Ownerships.Sum(o => o.SharePercent));
    }

    [Fact]
    public void The_same_owner_is_not_added_twice()
    {
        var lot = NewLot();
        var owner = Guid.NewGuid();
        lot.AssignOwner(owner, 50);
        lot.AssignOwner(owner, 50);
        Assert.Single(lot.Ownerships);
    }
}
