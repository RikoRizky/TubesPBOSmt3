using MeowPlace.Api.Models.Enums;

namespace MeowPlace.Api.Models.DTOs;

public class ArtSpecDto
{
    public string Type { get; set; } = "bag";
    public string Palette { get; set; } = "orange";
}

public class ProductDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? OldPrice { get; set; }
    public double Rating { get; set; }
    public int Reviews { get; set; }
    public string? Badge { get; set; }
    public ArtSpecDto Art { get; set; } = new();
    public string Tint { get; set; } = "#FFE9D6";
    public int Stock { get; set; }
}

public class OrderItemDto
{
    public string ProductId { get; set; } = string.Empty;
    public int Qty { get; set; }
    public ProductDto? Product { get; set; }
}

public class OrderDto
{
    public string Id { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Courier { get; set; } = string.Empty;
    public string? Resi { get; set; }
    public string Eta { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = "QRIS";
    public string? Notes { get; set; }
    public decimal Subtotal { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal Total { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
    public Dictionary<string, string> Timeline { get; set; } = new();
}

public class TrackOrderRequest
{
    public string OrderId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

public class CreateReviewDto
{
    public string ProductId { get; set; } = string.Empty;
    public string? OrderId { get; set; }
    public string CustomerName { get; set; } = "Pelanggan MeowPlace";
    public string Email { get; set; } = string.Empty;
    public int ProductRating { get; set; } = 5;
    public int ServiceRating { get; set; } = 5;
    public string? Comment { get; set; }
}

public class ReviewDto
{
    public int Id { get; set; }
    public string ProductId { get; set; } = string.Empty;
    public string? ProductName { get; set; }
    public string? OrderId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int ProductRating { get; set; }
    public int ServiceRating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CheckoutItemDto
{
    public string ProductId { get; set; } = string.Empty;
    public int Qty { get; set; }
}

public class CheckoutRequestDto
{
    public string CustomerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Courier { get; set; } = "Kurir MeowPlace (Same Day)";
    public string PaymentMethod { get; set; } = "QRIS";
    public string? Notes { get; set; }
    public List<CheckoutItemDto> Items { get; set; } = new();
}

public class UpdateStockDto
{
    public int Stock { get; set; }
    public decimal? Price { get; set; }
}

public class UpdateOrderStatusDto
{
    public OrderStatus Status { get; set; }
    public string? Resi { get; set; }
}

public class AdminSummaryDto
{
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public int TotalProducts { get; set; }
    public int LowStockProductsCount { get; set; }
    public double AverageProductRating { get; set; }
    public double AverageServiceRating { get; set; }
    public List<OrderDto> RecentOrders { get; set; } = new();
    public List<ReviewDto> RecentReviews { get; set; } = new();
}

public class NewsletterRequestDto
{
    public string Email { get; set; } = string.Empty;
}

public class LoginRequestDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}
