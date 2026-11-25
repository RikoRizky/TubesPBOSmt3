using System.Text.Json;
using MeowPlace.Api.Models.DTOs;
using MeowPlace.Api.Models.Entities;
using MeowPlace.Api.Models.Enums;
using MeowPlace.Api.Repositories;

namespace MeowPlace.Api.Services;

public interface IOrderService
{
    Task<OrderDto?> TrackOrderAsync(string orderId, string email);
    Task<OrderDto> CreateOrderAsync(CheckoutRequestDto request);
    Task<OrderDto?> UpdateOrderStatusAsync(string orderId, OrderStatus status, string? resi);
    Task<IEnumerable<OrderDto>> GetAllOrdersAsync();
    Task<IEnumerable<OrderDto>> GetHistoryByEmailAsync(string email);
    Task<OrderDto?> GetOrderByIdAsync(string id);
}

public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IProductRepository _productRepository;

    public OrderService(IOrderRepository orderRepository, IProductRepository productRepository)
    {
        _orderRepository = orderRepository;
        _productRepository = productRepository;
    }

    public async Task<OrderDto?> TrackOrderAsync(string orderId, string email)
    {
        var cleanId = orderId.Trim();
        var cleanEmail = email.Trim();
        var order = await _orderRepository.FindByIdAndEmailAsync(cleanId, cleanEmail);
        return order?.ToDto();
    }

    public async Task<OrderDto> CreateOrderAsync(CheckoutRequestDto request)
    {
        if (request.Items == null || !request.Items.Any())
        {
            throw new ArgumentException("Pesanan harus memiliki minimal satu item.");
        }

        var orderId = $"MP-{DateTime.UtcNow:yyMMdd}{Random.Shared.Next(100, 999)}";
        decimal subtotal = 0;
        var orderItems = new List<OrderItem>();

        foreach (var item in request.Items)
        {
            var product = await _productRepository.GetByIdAsync(item.ProductId);
            if (product == null)
            {
                throw new InvalidOperationException($"Produk dengan ID {item.ProductId} tidak ditemukan.");
            }

            // Kurangi stok dengan metode enkapsulasi OOP di domain model
            product.ReduceStock(item.Qty);
            await _productRepository.UpdateAsync(product);

            var itemSubtotal = product.Price * item.Qty;
            subtotal += itemSubtotal;

            orderItems.Add(new OrderItem
            {
                OrderId = orderId,
                ProductId = product.Id,
                Qty = item.Qty,
                UnitPrice = product.Price,
                Product = product
            });
        }

        // Gratis ongkir untuk belanja >= Rp200.000 (sesuai aturan bisnis Frontend)
        decimal shippingFee = subtotal >= 200000 ? 0 : 15000;
        decimal total = subtotal + shippingFee;

        var timeline = new Dictionary<string, string>
        {
            ["dibuat"] = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:sszzz"),
            ["dibayar"] = DateTime.UtcNow.AddMinutes(2).ToString("yyyy-MM-ddTHH:mm:sszzz")
        };

        var order = new Order
        {
            Id = orderId,
            CustomerName = string.IsNullOrWhiteSpace(request.CustomerName) ? "Pelanggan MeowPlace" : request.CustomerName.Trim(),
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? "-" : request.Phone.Trim(),
            Email = request.Email.Trim(),
            Address = request.Address.Trim(),
            Courier = string.IsNullOrWhiteSpace(request.Courier) ? "Kurir MeowPlace (Same Day)" : request.Courier.Trim(),
            PaymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod) ? "QRIS" : request.PaymentMethod.Trim(),
            Notes = request.Notes,
            Eta = DateTime.UtcNow.AddDays(2).ToString("dddd, d MMM yyyy"),
            Status = OrderStatus.Dibayar,
            Subtotal = subtotal,
            ShippingFee = shippingFee,
            Total = total,
            TimelineJson = JsonSerializer.Serialize(timeline),
            Items = orderItems
        };

        await _orderRepository.AddAsync(order);
        return order.ToDto();
    }

    public async Task<OrderDto?> UpdateOrderStatusAsync(string orderId, OrderStatus status, string? resi)
    {
        var order = await _orderRepository.GetOrderWithItemsAsync(orderId);
        if (order == null) return null;

        order.UpdateStatus(status, resi);

        // Update timeline status
        Dictionary<string, string> timeline = new();
        try
        {
            if (!string.IsNullOrWhiteSpace(order.TimelineJson))
            {
                timeline = JsonSerializer.Deserialize<Dictionary<string, string>>(order.TimelineJson) ?? new();
            }
        }
        catch { }

        string statusKey = status switch
        {
            OrderStatus.Dibuat => "dibuat",
            OrderStatus.Dibayar => "dibayar",
            OrderStatus.Dikemas => "dikemas",
            OrderStatus.Dikirim => "dikirim",
            OrderStatus.Sampai => "sampai",
            _ => "proses"
        };

        timeline[statusKey] = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:sszzz");
        order.TimelineJson = JsonSerializer.Serialize(timeline);

        await _orderRepository.UpdateAsync(order);
        return order.ToDto();
    }

    public async Task<IEnumerable<OrderDto>> GetAllOrdersAsync()
    {
        var orders = await _orderRepository.GetAllOrdersWithItemsAsync();
        return orders.Select(o => o.ToDto());
    }

    public async Task<IEnumerable<OrderDto>> GetHistoryByEmailAsync(string email)
    {
        var orders = await _orderRepository.GetOrdersByEmailAsync(email);
        return orders.Select(o => o.ToDto());
    }

    public async Task<OrderDto?> GetOrderByIdAsync(string id)
    {
        var order = await _orderRepository.GetOrderWithItemsAsync(id);
        return order?.ToDto();
    }
}
