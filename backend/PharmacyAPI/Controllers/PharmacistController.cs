using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Authorize(Roles = "Pharmacist")]
[ApiController]
[Route("api/pharmacist")]
public class PharmacistController : ControllerBase
{
    [HttpGet("medicines")]
    public IActionResult GetMedicines()
    {
        return Ok("Pharmacist access granted");
    }
}
