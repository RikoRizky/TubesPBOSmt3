using Microsoft.AspNetCore.Mvc;
using MeowPlace.Api.Models.DTOs;
using MeowPlace.Api.Services;

namespace MeowPlace.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly IReportService _reportService;
    private readonly IInventoryService _inventoryService;
    private readonly IOrderService _orderService;
    private readonly IReviewService _reviewService;

    public AdminController(
        IReportService reportService,
        IInventoryService inventoryService,
        IOrderService orderService,
        IReviewService reviewService)
    {
        _reportService = reportService;
        _inventoryService = inventoryService;
        _orderService = orderService;
        _reviewService = reviewService;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<AdminSummaryDto>> GetSummary()
    {
        var summary = await _reportService.GetAdminSummaryAsync();
        return Ok(summary);
    }

    [HttpGet("inventory")]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetInventory()
    {
        var inventory = await _inventoryService.GetInventoryListAsync();
        return Ok(inventory);
    }

    [HttpPut("inventory/{id}")]
    public async Task<ActionResult<ProductDto>> UpdateInventory(string id, [FromBody] UpdateStockDto dto)
    {
        var updated = await _inventoryService.UpdateStockAsync(id, dto.Stock, dto.Price);
        if (updated == null) return NotFound(new { message = $"Produk {id} tidak ditemukan." });
        return Ok(updated);
    }

    [HttpGet("orders")]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetOrders()
    {
        var orders = await _orderService.GetAllOrdersAsync();
        return Ok(orders);
    }

    [HttpPut("orders/{id}/status")]
    public async Task<ActionResult<OrderDto>> UpdateOrderStatus(string id, [FromBody] UpdateOrderStatusDto dto)
    {
        var updated = await _orderService.UpdateOrderStatusAsync(id, dto.Status, dto.Resi);
        if (updated == null) return NotFound(new { message = $"Pesanan {id} tidak ditemukan." });
        return Ok(updated);
    }

    [HttpGet("reviews")]
    public async Task<ActionResult<IEnumerable<ReviewDto>>> GetReviews()
    {
        var reviews = await _reviewService.GetAllReviewsAsync();
        return Ok(reviews);
    }
}
