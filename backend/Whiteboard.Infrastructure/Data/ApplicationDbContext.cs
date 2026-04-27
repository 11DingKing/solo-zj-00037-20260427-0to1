using Microsoft.EntityFrameworkCore;
using Whiteboard.Core.Entities;

namespace Whiteboard.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Board> Boards { get; set; }
    public DbSet<BoardElement> BoardElements { get; set; }
    public DbSet<BoardParticipant> BoardParticipants { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.Username).IsUnique();
            entity.Property(u => u.Username).IsRequired().HasMaxLength(50);
            entity.Property(u => u.Email).IsRequired().HasMaxLength(100);
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.AvatarColor).HasMaxLength(7);
            entity.Property(u => u.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(u => u.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        modelBuilder.Entity<Board>(entity =>
        {
            entity.HasKey(b => b.Id);
            entity.HasIndex(b => b.OwnerId);
            entity.HasIndex(b => b.InviteCode).IsUnique();
            entity.Property(b => b.Name).IsRequired().HasMaxLength(100);
            entity.Property(b => b.Description).HasMaxLength(500);
            entity.Property(b => b.InviteCode).HasMaxLength(20);
            entity.Property(b => b.ThumbnailUrl).HasMaxLength(500);
            entity.Property(b => b.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(b => b.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(b => b.Owner)
                  .WithMany(u => u.OwnedBoards)
                  .HasForeignKey(b => b.OwnerId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BoardElement>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.BoardId);
            entity.Property(e => e.Type).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Data).IsRequired();
            entity.Property(e => e.Order).IsRequired();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.Board)
                  .WithMany(b => b.Elements)
                  .HasForeignKey(e => e.BoardId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BoardParticipant>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.HasIndex(p => new { p.BoardId, p.UserId }).IsUnique();
            entity.Property(p => p.Role).IsRequired().HasMaxLength(20).HasDefaultValue("viewer");
            entity.Property(p => p.JoinedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(p => p.Board)
                  .WithMany(b => b.Participants)
                  .HasForeignKey(p => p.BoardId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.User)
                  .WithMany(u => u.ParticipatedBoards)
                  .HasForeignKey(p => p.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is User || e.Entity is Board || e.Entity is BoardElement)
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Property("CreatedAt").CurrentValue = DateTime.UtcNow;
            }
            entry.Property("UpdatedAt").CurrentValue = DateTime.UtcNow;
        }
    }
}