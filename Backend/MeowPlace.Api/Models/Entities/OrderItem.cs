namespace MeowPlace.Api.Models.Entities;

public class OrderItem : BaseEntity
{
    public int Id { get; set; }

    public string OrderId { get; set; } = string.Empty;
    public virtual Order? Order { get; set; }

    public string ProductId { get; set; } = string.Empty;
    public virtual Product? Product { get; set; }

    public int Qty { get; set; }
    public decimal UnitPrice { get; set; }

    public decimal Subtotal => Qty * UnitPrice;
}
