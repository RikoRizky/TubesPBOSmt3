using MeowPlace.Api.Models.Enums;

namespace MeowPlace.Api.Models.Entities;

public class Product : BaseEntity
{
    private decimal _price;
    private int _stock;

    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public ProductCategory Category { get; set; }

    public decimal Price
    {
        get => _price;
        set
        {
            if (value < 0) throw new ArgumentException("Harga tidak boleh negatif.");
            _price = value;
        }
    }

    public decimal? OldPrice { get; set; }

    public int Stock
    {
        get => _stock;
        set
        {
            if (value < 0) throw new ArgumentException("Stok tidak boleh kurang dari 0.");
            _stock = value;
        }
    }

    public double Rating { get; set; } = 5.0;
    public int ReviewsCount { get; set; } = 0;
    public string? Badge { get; set; }

    // Properti estetika / visual SVG (kompatibel dengan frontend MeowPlace)
    public string ArtType { get; set; } = "bag";
    public string ArtPalette { get; set; } = "orange";
    public string Tint { get; set; } = "#FFE9D6";

    public bool IsActive { get; set; } = true;

    // Relasi
    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    // Metode Domain (Enkapsulasi Logic Bisnis)
    public void ReduceStock(int quantity)
    {
        if (quantity <= 0) throw new ArgumentException("Jumlah pengurangan harus lebih besar dari 0.");
        if (Stock < quantity) throw new InvalidOperationException($"Stok produk {Name} tidak mencukupi (sisa: {Stock}, diminta: {quantity}).");
        Stock -= quantity;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AddStock(int quantity)
    {
        if (quantity <= 0) throw new ArgumentException("Jumlah penambahan harus lebih besar dari 0.");
        Stock += quantity;
        UpdatedAt = DateTime.UtcNow;
    }

    public void RecalculateRating(int newRating)
    {
        if (newRating < 1 || newRating > 5) throw new ArgumentOutOfRangeException(nameof(newRating), "Rating harus 1-5.");
        double totalScore = (Rating * ReviewsCount) + newRating;
        ReviewsCount += 1;
        Rating = Math.Round(totalScore / ReviewsCount, 1);
        UpdatedAt = DateTime.UtcNow;
    }
}
