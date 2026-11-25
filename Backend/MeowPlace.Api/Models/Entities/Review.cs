namespace MeowPlace.Api.Models.Entities;

public class Review : BaseEntity
{
    public int Id { get; set; }

    public string ProductId { get; set; } = string.Empty;
    public virtual Product? Product { get; set; }

    public string? OrderId { get; set; }
    public virtual Order? Order { get; set; }

    public string CustomerName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    // Rating kualitas produk (makanan/mainan/perlengkapan): 1 - 5 bintang
    public int ProductRating { get; set; }

    // Rating pelayanan toko & kurir: 1 - 5 bintang
    public int ServiceRating { get; set; }

    // Catatan/review opsional
    public string? Comment { get; set; }
}
