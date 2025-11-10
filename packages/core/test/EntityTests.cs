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

    [Test]
    public async Task Entity_WithSameId_ShouldBeEqual()
    {
        // Arrange
        var id = Guid.NewGuid();
        var entity1 = new TestEntity(id);
        var entity2 = new TestEntity(id);

        // Act & Assert
        await Assert.That(entity1).IsEqualTo(entity2);
        await Assert.That(entity1 == entity2).IsTrue();
        await Assert.That(entity1 != entity2).IsFalse();
    }

    [Test]
    public async Task Entity_WithDifferentId_ShouldNotBeEqual()
    {
        // Arrange
        var entity1 = new TestEntity(Guid.NewGuid());
        var entity2 = new TestEntity(Guid.NewGuid());

        // Act & Assert
        await Assert.That(entity1).IsNotEqualTo(entity2);
        await Assert.That(entity1 == entity2).IsFalse();
        await Assert.That(entity1 != entity2).IsTrue();
    }

    [Test]
    public async Task Entity_GetHashCode_ShouldBeConsistent()
    {
        // Arrange
        var id = Guid.NewGuid();
        var entity = new TestEntity(id);

        // Act
        var hash1 = entity.GetHashCode();
        var hash2 = entity.GetHashCode();

        // Assert
        await Assert.That(hash1).IsEqualTo(hash2);
    }

    [Test]
    public async Task Entity_WithNullId_ShouldThrowException()
    {
        // Act & Assert
        await Assert.That(() => new TestEntityWithString(null!))
            .Throws<ArgumentNullException>();
    }
}
