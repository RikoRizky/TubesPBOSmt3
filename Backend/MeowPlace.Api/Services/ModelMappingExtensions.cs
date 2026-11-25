using System.Text.Json;
using MeowPlace.Api.Models.DTOs;
using MeowPlace.Api.Models.Entities;
using MeowPlace.Api.Models.Enums;

namespace MeowPlace.Api.Services;

public static class ModelMappingExtensions
{
    public static ProductDto ToDto(this Product product)
    {
        return new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            Category = product.Category switch
            {
                ProductCategory.Makanan => "makanan",
                ProductCategory.Camilan => "camilan",
                ProductCategory.Mainan => "mainan",
                ProductCategory.Perlengkapan => "perlengkapan",
                _ => "makanan"
            },
            Price = product.Price,
            OldPrice = product.OldPrice,
            Rating = product.Rating,
            Reviews = product.ReviewsCount,
            Badge = product.Badge,
            Art = new ArtSpecDto
            {
                Type = product.ArtType,
                Palette = product.ArtPalette
            },
            Tint = product.Tint,
            Stock = product.Stock
        };
    }

    public static OrderDto ToDto(this Order order)
    {
        Dictionary<string, string> timeline = new();
        try
        {
            if (!string.IsNullOrWhiteSpace(order.TimelineJson))
            {
                timeline = JsonSerializer.Deserialize<Dictionary<string, string>>(order.TimelineJson) ?? new();
            }
        }
        catch
        {
            // fallback empty timeline
        }

        return new OrderDto
        {
            Id = order.Id,
            CustomerName = order.CustomerName,
            Phone = order.Phone,
            Email = order.Email,
            Status = order.Status switch
            {
                OrderStatus.Dibuat => "dibuat",
                OrderStatus.Dibayar => "dibayar",
                OrderStatus.Dikemas => "dikemas",
                OrderStatus.Dikirim => "dikirim",
                OrderStatus.Sampai => "sampai",
                _ => "dibuat"
            },
            Courier = order.Courier,
            Resi = order.Resi,
            Eta = order.Eta,
            Address = order.Address,
            PaymentMethod = order.PaymentMethod,
            Notes = order.Notes,
            Subtotal = order.Subtotal,
            ShippingFee = order.ShippingFee,
            Total = order.Total,
            CreatedAt = order.CreatedAt,
            Timeline = timeline,
            Items = order.Items.Select(item => new OrderItemDto
            {
                ProductId = item.ProductId,
                Qty = item.Qty,
                Product = item.Product?.ToDto()
            }).ToList()
        };
    }

    public static ReviewDto ToDto(this Review review)
    {
        return new ReviewDto
        {
            Id = review.Id,
            ProductId = review.ProductId,
            ProductName = review.Product?.Name,
            OrderId = review.OrderId,
            CustomerName = review.CustomerName,
            ProductRating = review.ProductRating,
            ServiceRating = review.ServiceRating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        };
    }
}
