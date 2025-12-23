using System;

namespace PharmacyAPI.Models
{
    public class Sale
    {
        public int Id { get; set; }
        public string InvoiceNumber { get; set; }
        public DateTime Date { get; set; }
        public string Customer { get; set; }
        public string Product { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public decimal Discount { get; set; }
        public decimal Total { get; set; }
        public string PaymentType { get; set; }
        public string Cashier { get; set; }
    }
}
