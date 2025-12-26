using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmacyAPI.Models;
using PharmacyAPI.Data;
using System.Security.Claims;

[Authorize(Roles = "Pharmacist")]
[ApiController]
[Route("api/pharmacist")]
public class PharmacistController : ControllerBase
{
    private readonly PharmacyDbContext _context;

    public PharmacistController(PharmacyDbContext context)
    {
        _context = context;
    }
    private string GenerateInvoiceNumber()
{
    return $"INV-{DateTime.Now:yyyyMMddHHmmss}";
}


    [HttpGet("inventory/stats")]
    public IActionResult GetInventoryStats()
    {
        var today = DateTime.Today;
        var nearExpiryDate = today.AddDays(30);

        var medicines = _context.Medicines.ToList();

        return Ok(new
        {
            totalMedicines = medicines.Count,
            lowStock = medicines.Count(m => m.Quantity <= 5),
            expired = medicines.Count(m => m.ExpiryDate < today),
            nearExpiry = medicines.Count(m =>
                m.ExpiryDate >= today && m.ExpiryDate <= nearExpiryDate)
        });
    }
    
    [HttpGet("medicines")]
    public IActionResult GetMedicines()
    {
        return Ok("Pharmacist access granted");
    }

    [HttpGet("inventory")]
    public IActionResult GetInventory()
    {
        return Ok(_context.Medicines.ToList());
    }

    [HttpPut("inventory/{id}")]
    public IActionResult UpdateStock(int id, [FromBody] UpdateStockDto dto)
    {
        var med = _context.Medicines.Find(id);
        if (med == null) return NotFound();

        med.Quantity = dto.Quantity;
        med.ExpiryDate = dto.ExpiryDate;
    med.UpdatedAt = DateTime.Now;  

        _context.SaveChanges();
        return Ok();
    }

    [HttpGet("alerts")]
public IActionResult GetAlerts()
{
    var today = DateTime.Today;
    var nearExpiryDate = today.AddDays(30);

    var medicines = _context.Medicines.ToList();

    var alerts = medicines.Select(m => 
    {
        if (m.ExpiryDate < today)
        {
            return new {
                id = m.Id,
                name = m.Name,
                brand = m.Brand,
                quantity = m.Quantity,
                expiryDate = m.ExpiryDate,
                type = "expired",
                message = "This medicine has expired!"
            };
        }
        else if (m.ExpiryDate >= today && m.ExpiryDate <= nearExpiryDate)
        {
            return new {
                id = m.Id,
                name = m.Name,
                brand = m.Brand,
                quantity = m.Quantity,
                expiryDate = m.ExpiryDate,
                type = "nearExpiry",
                message = "This medicine is nearing its expiry date."
            };
        }
        else if (m.Quantity <= 5)
        {
            return new {
                id = m.Id,
                name = m.Name,
                brand = m.Brand,
                quantity = m.Quantity,
                expiryDate = m.ExpiryDate,
                type = "lowStock",
                message = "This medicine is low in stock."
            };
        }
        else
        {
            return null;
        }
    }).Where(a => a != null).ToList();

    return Ok(alerts);
}
[HttpGet("sales/top-medicines")]
public IActionResult GetTopSellingMedicines()
{
    var topSales = _context.Sales
        .GroupBy(s => s.Product)
        .Select(g => new
        {
            Product = g.Key,
            TotalSold = g.Sum(s => s.Quantity),
            Revenue = g.Sum(s => s.Total)
        })
        .OrderByDescending(x => x.TotalSold)
        .Take(5) 
        .ToList();

    return Ok(topSales);
}

[HttpPost("sales")]
public IActionResult CreateSale([FromBody] CreateSaleDto dto)
{
    var medicine = _context.Medicines.Find(dto.ProductId); 
    if (medicine == null)
        return BadRequest("Medicine not found");

    if (medicine.Quantity < dto.Quantity)
        return BadRequest("Insufficient stock");

    var cashierEmail = User.FindFirst(ClaimTypes.Email)?.Value ?? "Unknown";

    var sale = new Sale
    {
        InvoiceNumber = GenerateInvoiceNumber(),
        Date = DateTime.Now,
        Customer = dto.Customer,
        Product = medicine.Name,  
        Quantity = dto.Quantity,
        Price = dto.Price,
        Discount = dto.Discount,
        Total = (dto.Price * dto.Quantity) - dto.Discount,
        PaymentType = dto.PaymentType,
        Cashier = cashierEmail
    };

    medicine.Quantity -= dto.Quantity;

    _context.Sales.Add(sale);
    _context.SaveChanges();

    return Ok(new { message = "Sale completed" });
}


[HttpGet("inventory/medicines-list")]
public IActionResult GetMedicinesList()
{
    var medicines = _context.Medicines
        .Select(m => new {
            m.Id,
            m.Name,
            m.Quantity,
            m.Price
        })
        .ToList();

    return Ok(medicines);
}

[HttpPost("purchases")]
public IActionResult AddPurchase([FromBody] Purchase dto)
{
    dto.OrderNumber = $"PO-{DateTime.Now:yyyyMMddHHmmss}";

    _context.Purchases.Add(dto);

    // If already received, update inventory
    if(dto.Status == "Received")
    {
        var med = _context.Medicines.FirstOrDefault(m => m.Name == dto.Medicine);
        if(med != null) med.Quantity += dto.Quantity;
    }

    _context.SaveChanges();
    return Ok(dto);
}

[HttpGet("purchases")]
public IActionResult GetPurchases()
{
    return Ok(_context.Purchases.OrderByDescending(p => p.Date).ToList());
}

[HttpPut("purchases/{id}/receive")]
public IActionResult ReceivePurchase(int id)
{
    var purchase = _context.Purchases.Find(id);
    if (purchase == null) return NotFound();

    if (purchase.Status != "Received")
    {
        purchase.Status = "Received";

        // Try to find existing medicine
        var med = _context.Medicines.FirstOrDefault(m => m.Name == purchase.Medicine);

        if (med != null)
        {
            // Update existing stock
            med.Quantity += purchase.Quantity;
            med.UpdatedAt = DateTime.Now;
        }
        else
        {
            // Add new medicine to inventory
            var newMed = new Medicine
            {
                Name = purchase.Medicine,
                Brand = "", 
                Category = "General", 
                Quantity = purchase.Quantity,
                Price = purchase.TotalCost / purchase.Quantity, 
                ExpiryDate = DateTime.Today.AddYears(1), 
                UpdatedAt = DateTime.Now
            };
            _context.Medicines.Add(newMed);
        }

        _context.SaveChanges();
    }

    return Ok(purchase);
}


}

public class UpdateStockDto
{
    public int Quantity { get; set; }
    public DateTime ExpiryDate { get; set; }
}
public class CreateSaleDto
{
    public string Customer { get; set; } = "Walk-in";
    public int ProductId { get; set; }         
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal Discount { get; set; } = 0;
    public string PaymentType { get; set; } = null!;
}

