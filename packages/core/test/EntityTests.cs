namespace Seedwork.Core.Tests;

public class EntityTests
{
    private class TestEntity : Entity<Guid>
    {
        public TestEntity(Guid id) : base(id) { }
    }
    
    private class TestEntityWithString : Entity<string>
    {
        public TestEntityWithString(string id) : base(id) { }
    }

    [Fact]
    public void Entity_WithSameId_ShouldBeEqual()
    {
        // Arrange
        var id = Guid.NewGuid();
        var entity1 = new TestEntity(id);
        var entity2 = new TestEntity(id);

        // Act & Assert
        Assert.Equal(entity1, entity2);
        Assert.True(entity1 == entity2);
        Assert.False(entity1 != entity2);
    }

    [Fact]
    public void Entity_WithDifferentId_ShouldNotBeEqual()
    {
        // Arrange
        var entity1 = new TestEntity(Guid.NewGuid());
        var entity2 = new TestEntity(Guid.NewGuid());

        // Act & Assert
        Assert.NotEqual(entity1, entity2);
        Assert.False(entity1 == entity2);
        Assert.True(entity1 != entity2);
    }

    [Fact]
    public void Entity_GetHashCode_ShouldBeConsistent()
    {
        // Arrange
        var id = Guid.NewGuid();
        var entity = new TestEntity(id);

        // Act
        var hash1 = entity.GetHashCode();
        var hash2 = entity.GetHashCode();

        // Assert
        Assert.Equal(hash1, hash2);
    }

    [Fact]
    public void Entity_WithNullId_ShouldThrowException()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => new TestEntityWithString(null!));
    }
}
