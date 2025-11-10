namespace Seedwork.Domain;

/// <summary>
/// Base class for aggregate roots in Domain-Driven Design.
/// </summary>
public abstract class AggregateRoot<TId> where TId : notnull
{
    public TId Id { get; protected set; }

    protected AggregateRoot(TId id)
    {
        Id = id;
    }
}
