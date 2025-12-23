using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PharmacyAPI.Models;
using PharmacyAPI.Data;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly PharmacyDbContext _context;

    public AdminController(PharmacyDbContext context)
    {
        _context = context;
    }

    public class CreateUserDto
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string Role { get; set; }
    }

    // ✅ Get all users
    [HttpGet("users")]
    public IActionResult GetUsers()
    {
        var users = _context.Users
            .Select(u => new {
                u.Id,
                u.Name,
                u.Email,
                u.Role,
                u.IsActive
            })
            .ToList();

        return Ok(users);
    }

    // ✅ Create user
    [HttpPost("users")]
    public IActionResult CreateUser(CreateUserDto dto)
    {
        if (_context.Users.Any(u => u.Email == dto.Email))
            return BadRequest("User already exists");

        var user = new User
        {
            Name = dto.Name,
            Email = dto.Email,
            Role = dto.Role,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            IsActive = true
        };

        _context.Users.Add(user);
        _context.SaveChanges();

        return Ok(new { message = "User created" });
    }

    // ✅ Activate / Deactivate
    [HttpPut("users/{id}/status")]
    public IActionResult UpdateStatus(int id)
    {
        var user = _context.Users.Find(id);
        if (user == null) return NotFound();

        user.IsActive = !user.IsActive;
        _context.SaveChanges();

        return Ok(new { message = "Status Updated" });
    }

    // Get all medicines
    [HttpGet("medicines")]
    public IActionResult GetMedicines()
    {
        return Ok(_context.Medicines.ToList());
    }

    // Add medicine
    [HttpPost("medicines")]
    public IActionResult AddMedicine([FromBody] Medicine medicine)
    {
        _context.Medicines.Add(medicine);
        _context.SaveChanges();
        return Ok(medicine);
    }

    // Delete medicine
    [HttpDelete("medicines/{id}")]
    public IActionResult DeleteMedicine(int id)
    {
        var med = _context.Medicines.Find(id);
        if (med == null) return NotFound();
        _context.Medicines.Remove(med);
        _context.SaveChanges();
        return Ok();
    }

    // Update medicine
    [HttpPut("medicines/{id}")]
    public IActionResult UpdateMedicine(int id, [FromBody] Medicine updatedMed)
    {
        var med = _context.Medicines.Find(id);
        if (med == null) return NotFound();

        med.Name = updatedMed.Name;
        med.Brand = updatedMed.Brand;
        med.Category = updatedMed.Category;
        med.Price = updatedMed.Price;
        med.Quantity = updatedMed.Quantity;
        med.ExpiryDate = updatedMed.ExpiryDate;

        _context.SaveChanges();
        return Ok(med);
    }

    // ✅ FIXED: Get all sales with optional filters - make parameters nullable
    [HttpGet("sales")]
    public IActionResult GetSales([FromQuery] string? startDate, [FromQuery] string? endDate, 
        [FromQuery] string? search, [FromQuery] string? cashier)
    {
        var query = _context.Sales.AsQueryable();

        if (!string.IsNullOrEmpty(startDate) && DateTime.TryParse(startDate, out var sd))
            query = query.Where(s => s.Date >= sd);

        if (!string.IsNullOrEmpty(endDate) && DateTime.TryParse(endDate, out var ed))
            query = query.Where(s => s.Date <= ed);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(s => s.Product.Contains(search) || s.InvoiceNumber.Contains(search));

        if (!string.IsNullOrEmpty(cashier))
            query = query.Where(s => s.Cashier == cashier);

        return Ok(query.ToList());
    }

    // Export sales as CSV
    [HttpGet("sales/export")]
    public IActionResult ExportSales()
    {
        var sales = _context.Sales.ToList();
        var csv = "InvoiceNumber,Date,Customer,Product,Quantity,Price,Discount,Total,PaymentType,Cashier\n";

        foreach (var s in sales)
        {
            csv += $"{s.InvoiceNumber},{s.Date},{s.Customer},{s.Product},{s.Quantity},{s.Price},{s.Discount},{s.Total},{s.PaymentType},{s.Cashier}\n";
        }

        var bytes = System.Text.Encoding.UTF8.GetBytes(csv);
        return File(bytes, "text/csv", "sales-report.csv");
    }

    // ✅ Get all purchases - already correct with nullable DateTime?
    [HttpGet("purchases")]
    public IActionResult GetPurchases([FromQuery] string? search, [FromQuery] string? supplier, 
        [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var query = _context.Purchases.AsQueryable();

        if (startDate.HasValue)
            query = query.Where(p => p.Date >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(p => p.Date <= endDate.Value);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(p => p.Medicine.Contains(search) || p.OrderNumber.Contains(search));

        if (!string.IsNullOrEmpty(supplier))
            query = query.Where(p => p.Supplier.Contains(supplier));

        return Ok(query.ToList());
    }

    // Export purchases as CSV
    [HttpGet("purchases/export")]
    public IActionResult ExportPurchases()
    {
        var purchases = _context.Purchases.ToList();
        var csv = "OrderNumber,Date,Supplier,Medicine,Quantity,TotalCost,Status\n";
        foreach (var p in purchases)
            csv += $"{p.OrderNumber},{p.Date},{p.Supplier},{p.Medicine},{p.Quantity},{p.TotalCost},{p.Status}\n";

        var bytes = System.Text.Encoding.UTF8.GetBytes(csv);
        return File(bytes, "text/csv", "purchase-report.csv");
    }

    [HttpGet("reports/monthly-sales")]
public IActionResult GetMonthlySales()
{
    var data = _context.Sales
        .GroupBy(s => new { s.Date.Year, s.Date.Month })
        .Select(g => new {
            month = g.Key.Month,
            year = g.Key.Year,
            total = g.Sum(x => x.Total)
        })
        .OrderBy(x => x.year)
        .ThenBy(x => x.month)
        .ToList();

    return Ok(data);
}
[HttpGet("reports/summary")]
public IActionResult GetSummary()
{
    var today = DateTime.Today;
var startOfMonth = new DateTime(today.Year, today.Month, 1);
var startOfNextMonth = startOfMonth.AddMonths(1);

return Ok(new
{
    todaySalesCount = _context.Sales.Count(s => s.Date.Date == today),
    todaySalesAmount = _context.Sales
        .Where(s => s.Date.Date == today)
        .Sum(s => (decimal?)s.Total) ?? 0,
    totalSalesCount = _context.Sales.Count(), // total number of sales
    totalOrdersCount = _context.Sales.Count(), // total orders = total sales
totalPurchasesAmount = _context.Purchases.Sum(p => (decimal?)p.TotalCost) ?? 0
,    monthSalesAmount = _context.Sales
        .Where(s => s.Date >= startOfMonth && s.Date < startOfNextMonth)
        .Sum(s => (decimal?)s.Total) ?? 0
});

}

[HttpGet("reports/yearly-sales")]
public IActionResult GetYearlySales()
{
    var data = _context.Sales
        .GroupBy(s => s.Date.Year)
        .Select(g => new
        {
            year = g.Key,
            total = g.Sum(x => x.Total)
        })
        .OrderBy(x => x.year)
        .ToList();

    return Ok(data);
}
[HttpGet("reports/monthly-purchases")]
public IActionResult GetMonthlyPurchases()
{
    var data = _context.Purchases
        .GroupBy(p => new { p.Date.Year, p.Date.Month })
        .Select(g => new {
            month = g.Key.Month,
            year = g.Key.Year,
            total = g.Sum(x => x.TotalCost)
        })
        .OrderBy(x => x.year).ThenBy(x => x.month)
        .ToList();
    return Ok(data);
}

[HttpGet("reports/yearly-purchases")]
public IActionResult GetYearlyPurchases()
{
    var data = _context.Purchases
        .GroupBy(p => p.Date.Year)
        .Select(g => new {
            year = g.Key,
            total = g.Sum(x => x.TotalCost)
        })
        .OrderBy(x => x.year)
        .ToList();
    return Ok(data);
}

}