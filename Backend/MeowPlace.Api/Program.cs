using Microsoft.EntityFrameworkCore;
using MeowPlace.Api.Data;
using MeowPlace.Api.Repositories;
using MeowPlace.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Database SQLite & Entity Framework Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=meowplace.db";
builder.Services.AddDbContext<MeowPlaceDbContext>(options =>
    options.UseSqlite(connectionString));

// 2. Dependency Injection - Repositories (Konsep OOP & Pattern)
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();

// 3. Dependency Injection - Services
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IReportService, ReportService>();

// 4. CORS agar Frontend bisa menghubungi API tanpa blokir browser
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 5. Controllers & JSON Case Sensitivity (camelCase secara default)
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddOpenApi();

var app = builder.Build();

// Otomatis buat database SQLite dan masukkan data awal (Seed) jika belum ada
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<MeowPlaceDbContext>();
    DataSeeder.Seed(context);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");

app.MapControllers();

// Health check endpoint
app.MapGet("/", () => Results.Ok(new
{
    app = "MeowPlace Backend API",
    status = "Online",
    version = "1.0.0",
    docs = "/openapi/v1.json"
}));

app.Run();
