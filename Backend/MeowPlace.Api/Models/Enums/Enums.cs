using System.Text.Json.Serialization;

namespace MeowPlace.Api.Models.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ProductCategory
{
    [JsonPropertyName("makanan")]
    Makanan,
    [JsonPropertyName("camilan")]
    Camilan,
    [JsonPropertyName("mainan")]
    Mainan,
    [JsonPropertyName("perlengkapan")]
    Perlengkapan
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum OrderStatus
{
    [JsonPropertyName("dibuat")]
    Dibuat,
    [JsonPropertyName("dibayar")]
    Dibayar,
    [JsonPropertyName("dikemas")]
    Dikemas,
    [JsonPropertyName("dikirim")]
    Dikirim,
    [JsonPropertyName("sampai")]
    Sampai
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ReturnReason
{
    [JsonPropertyName("doyan")]
    TidakDoyan,
    [JsonPropertyName("rusak")]
    Rusak,
    [JsonPropertyName("salah")]
    SalahKirim,
    [JsonPropertyName("lainnya")]
    Lainnya
}
