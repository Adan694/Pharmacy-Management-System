using Microsoft.EntityFrameworkCore;
using PharmacyAPI.Models;
using BCrypt.Net;

namespace PharmacyAPI.Data
{
    public class PharmacyDbContext : DbContext
    {
        public PharmacyDbContext(DbContextOptions<PharmacyDbContext> options) : base(options)
        {
        }

        // Tables
        public DbSet<User> Users { get; set; }
        public DbSet<Medicine> Medicines { get; set; }
        public DbSet<Sale> Sales { get; set; }
        public DbSet<Purchase> Purchases { get; set; }
        public DbSet<PurchaseItem> PurchaseItems { get; set; }
        public DbSet<SaleItem> SaleItems { get; set; } // fixed typo

        // <-- Move OnModelCreating inside the class
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = 1,
                    Name = "System Admin",
                    Email = "admin@pharmacy.com",
                    // PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    PasswordHash= "$2a$11$fKjV2IZGr./Cm/2dKNyG9OcGbIjvF6V9Z33Ghew/7y8gSe6skS.o6",
                    Role = "Admin",
                    IsActive = true
                }
            );
        }
    }
}
