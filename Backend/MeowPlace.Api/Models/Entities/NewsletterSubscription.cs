namespace MeowPlace.Api.Models.Entities;

public class NewsletterSubscription : BaseEntity
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
}
