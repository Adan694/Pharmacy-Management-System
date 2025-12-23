namespace PharmacyAPI.Models
{
    public class Purchase
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; }
        public DateTime Date { get; set; }
        public string Supplier { get; set; }
        public string Medicine { get; set; }
        public int Quantity { get; set; }
        public decimal TotalCost { get; set; }
        public string Status { get; set; } // Pending, Received
    }
}
