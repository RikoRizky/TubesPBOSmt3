using System.Text.Json;
using MeowPlace.Api.Models.Entities;
using MeowPlace.Api.Models.Enums;

namespace MeowPlace.Api.Data;

public static class DataSeeder
{
    public static void Seed(MeowPlaceDbContext context)
    {
        context.Database.EnsureCreated();

        if (!context.Products.Any())
        {
            var products = new List<Product>
            {
                new() { Id = "p01", Name = "Salmon Kitten Dry Food 1,5 kg", Category = ProductCategory.Makanan, Price = 145000, OldPrice = 189000, Stock = 45, Rating = 4.9, ReviewsCount = 1240, ArtType = "bag", ArtPalette = "orange", Tint = "#FFE9D6" },
                new() { Id = "p02", Name = "Tuna Pâté in Gravy 85 g", Category = ProductCategory.Makanan, Price = 18500, Stock = 120, Rating = 4.8, ReviewsCount = 3410, Badge = "Terlaris", ArtType = "can", ArtPalette = "tangerine", Tint = "#FFF1CC" },
                new() { Id = "p03", Name = "Chicken Crunch Treats 60 g", Category = ProductCategory.Camilan, Price = 32000, OldPrice = 40000, Stock = 35, Rating = 4.8, ReviewsCount = 2120, ArtType = "pouch", ArtPalette = "rust", Tint = "#FDE5DC" },
                new() { Id = "p04", Name = "Tikus Plush Isi Catnip", Category = ProductCategory.Mainan, Price = 25000, Stock = 50, Rating = 4.9, ReviewsCount = 980, ArtType = "mouse", ArtPalette = "brown", Tint = "#F6ECE1" },
                new() { Id = "p05", Name = "Menara Garukan Sisal 60 cm", Category = ProductCategory.Perlengkapan, Price = 289000, OldPrice = 349000, Stock = 12, Rating = 4.8, ReviewsCount = 720, ArtType = "scratcher", ArtPalette = "brown", Tint = "#FFE9D6" },
                new() { Id = "p06", Name = "Kasur Donat Fluffy", Category = ProductCategory.Perlengkapan, Price = 175000, Stock = 20, Rating = 4.9, ReviewsCount = 1930, Badge = "Terlaris", ArtType = "bed", ArtPalette = "cream", Tint = "#FDE5DC" },
                new() { Id = "p07", Name = "Salmon Bites Dental 80 g", Category = ProductCategory.Camilan, Price = 29000, Stock = 4, Rating = 4.6, ReviewsCount = 540, Badge = "Baru", ArtType = "pouch", ArtPalette = "honey", Tint = "#FFF1CC" }, // low stock example
                new() { Id = "p08", Name = "Pasir Gumpal Lavender 10 L", Category = ProductCategory.Perlengkapan, Price = 89000, OldPrice = 105000, Stock = 80, Rating = 4.8, ReviewsCount = 2710, ArtType = "litter", ArtPalette = "honey", Tint = "#F6ECE1" },
                new() { Id = "p09", Name = "Adult Indoor Chicken 2 kg", Category = ProductCategory.Makanan, Price = 168000, Stock = 30, Rating = 4.7, ReviewsCount = 860, ArtType = "bag", ArtPalette = "brown", Tint = "#F6ECE1" },
                new() { Id = "p10", Name = "Tongkat Bulu Interaktif", Category = ProductCategory.Mainan, Price = 35000, OldPrice = 45000, Stock = 65, Rating = 4.7, ReviewsCount = 1500, ArtType = "wand", ArtPalette = "rust", Tint = "#FFE9D6" },
                new() { Id = "p11", Name = "Air Mancur Minum 2 L", Category = ProductCategory.Perlengkapan, Price = 219000, Stock = 18, Rating = 4.7, ReviewsCount = 650, Badge = "Baru", ArtType = "fountain", ArtPalette = "cream", Tint = "#FDE5DC" },
                new() { Id = "p12", Name = "Bola Benang Wol Isi 3", Category = ProductCategory.Mainan, Price = 15000, Stock = 40, Rating = 4.5, ReviewsCount = 410, ArtType = "yarn", ArtPalette = "orange", Tint = "#FFF1CC" }
            };

            context.Products.AddRange(products);
            context.SaveChanges();
        }

        if (!context.Orders.Any())
        {
            var timeline1 = new Dictionary<string, string>
            {
                ["dibuat"] = "2026-11-06T09:12:00+07:00",
                ["dibayar"] = "2026-11-06T09:15:00+07:00",
                ["dikemas"] = "2026-11-06T10:40:00+07:00"
            };

            var order1 = new Order
            {
                Id = "MP-261106",
                CustomerName = "Budi Santoso",
                Email = "demo@meowplace.id",
                Status = OrderStatus.Dikemas,
                Courier = "Kurir MeowPlace (Same Day)",
                Resi = null,
                Eta = "Jumat, 7 Nov 2026",
                Address = "Jl. Me**** No. 12, Jakarta Timur",
                Subtotal = 323000,
                ShippingFee = 0,
                Total = 323000,
                TimelineJson = JsonSerializer.Serialize(timeline1),
                Items = new List<OrderItem>
                {
                    new() { ProductId = "p01", Qty = 1, UnitPrice = 145000 },
                    new() { ProductId = "p08", Qty = 2, UnitPrice = 89000 }
                }
            };

            var timeline2 = new Dictionary<string, string>
            {
                ["dibuat"] = "2026-11-04T19:02:00+07:00",
                ["dibayar"] = "2026-11-04T19:09:00+07:00",
                ["dikemas"] = "2026-11-05T08:30:00+07:00",
                ["dikirim"] = "2026-11-05T16:45:00+07:00"
            };

            var order2 = new Order
            {
                Id = "MP-261104",
                CustomerName = "Siti Rahma",
                Email = "demo@meowplace.id",
                Status = OrderStatus.Dikirim,
                Courier = "JNE REG",
                Resi = "JNE0012345678",
                Eta = "Sabtu, 8 Nov 2026",
                Address = "Jl. Ce***** Raya No. 4, Bandung",
                Subtotal = 239000,
                ShippingFee = 15000,
                Total = 254000,
                TimelineJson = JsonSerializer.Serialize(timeline2),
                Items = new List<OrderItem>
                {
                    new() { ProductId = "p06", Qty = 1, UnitPrice = 175000 },
                    new() { ProductId = "p03", Qty = 2, UnitPrice = 32000 }
                }
            };

            var timeline3 = new Dictionary<string, string>
            {
                ["dibuat"] = "2026-10-28T11:20:00+07:00",
                ["dibayar"] = "2026-10-28T11:22:00+07:00",
                ["dikemas"] = "2026-10-28T14:05:00+07:00",
                ["dikirim"] = "2026-10-29T09:10:00+07:00",
                ["sampai"] = "2026-10-30T13:05:00+07:00"
            };

            var order3 = new Order
            {
                Id = "MP-261028",
                CustomerName = "Ahmad Dani",
                Email = "demo@meowplace.id",
                Status = OrderStatus.Sampai,
                Courier = "SiCepat BEST",
                Resi = "SCP0098765432",
                Eta = "Diterima 30 Okt 2026",
                Address = "Jl. An***** No. 7, Depok",
                Subtotal = 126000,
                ShippingFee = 10000,
                Total = 136000,
                TimelineJson = JsonSerializer.Serialize(timeline3),
                Items = new List<OrderItem>
                {
                    new() { ProductId = "p02", Qty = 6, UnitPrice = 18500 },
                    new() { ProductId = "p12", Qty = 1, UnitPrice = 15000 }
                }
            };

            context.Orders.AddRange(order1, order2, order3);
            context.SaveChanges();
        }

        if (!context.Reviews.Any())
        {
            var initialReviews = new List<Review>
            {
                new()
                {
                    ProductId = "p02",
                    OrderId = "MP-261028",
                    CustomerName = "Ahmad Dani",
                    Email = "demo@meowplace.id",
                    ProductRating = 5,
                    ServiceRating = 5,
                    Comment = "Kucing saya langsung lahap makannya! Pâté-nya basah dan wangi daging asli. Pengiriman juga cepat sekali."
                },
                new()
                {
                    ProductId = "p01",
                    CustomerName = "Clara Anggraini",
                    Email = "clara@gmail.com",
                    ProductRating = 5,
                    ServiceRating = 4,
                    Comment = "Kitten bulunya makin halus dan gemuk setelah 2 minggu makan ini. Recommended banget!"
                },
                new()
                {
                    ProductId = "p05",
                    CustomerName = "Reza Fahlevi",
                    Email = "reza@yahoo.com",
                    ProductRating = 4,
                    ServiceRating = 5,
                    Comment = "Tinggi menara pas, tali sisalnya kuat ga gampang lepas pas dicakar kucing."
                }
            };

            context.Reviews.AddRange(initialReviews);
            context.SaveChanges();
        }

        if (!context.AdminUsers.Any())
        {
            var defaultAdmin = new AdminUser
            {
                Username = "admin",
                FullName = "Administrator MeowPlace",
                Role = "SuperAdmin"
            };
            defaultAdmin.SetPassword("admin123");

            context.AdminUsers.Add(defaultAdmin);
            context.SaveChanges();
        }
    }
}
