using MeowPlace.Api.Models.Enums;

namespace MeowPlace.Api.Models.Entities;

public class OrderReturn : BaseEntity
{
    public int Id { get; set; }
    public string Ticket { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public ReturnReason Reason { get; set; }
    public string Note { get; set; } = string.Empty;
    public string? PhotoPath { get; set; }
    public string Status { get; set; } = "Diajukan";
}
