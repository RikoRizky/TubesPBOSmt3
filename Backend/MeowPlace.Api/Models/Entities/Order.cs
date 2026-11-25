using MeowPlace.Api.Models.Enums;

namespace MeowPlace.Api.Models.Entities;

public class Order : BaseEntity
{
    public string Id { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Courier { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = "QRIS";
    public string? Notes { get; set; }
    public string? Resi { get; set; }
    public string Eta { get; set; } = string.Empty;
    public OrderStatus Status { get; set; } = OrderStatus.Dibayar;

    public decimal Subtotal { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal Total { get; set; }

    public string TimelineJson { get; set; } = "{}";

    public virtual ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public void UpdateStatus(OrderStatus newStatus, string? newResi = null)
    {
        Status = newStatus;
        if (!string.IsNullOrEmpty(newResi))
        {
            Resi = newResi;
        }
        UpdatedAt = DateTime.UtcNow;
    }
}
