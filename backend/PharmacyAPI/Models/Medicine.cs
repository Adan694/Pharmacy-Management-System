namespace PharmacyAPI.Models
{
    public class Medicine
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Brand { get; set; }
        public string Category { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public DateTime ExpiryDate { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.Now;

    }
}
