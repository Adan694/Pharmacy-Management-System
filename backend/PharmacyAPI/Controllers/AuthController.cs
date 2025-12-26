using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using PharmacyAPI.Data;
using PharmacyAPI.Models;
using BCrypt.Net;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly PharmacyDbContext _context;
    private readonly IConfiguration _config;

    public AuthController(PharmacyDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginDto dto)
    {
        var user = _context.Users.SingleOrDefault(u => u.Email == dto.Email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized("Invalid credentials");

            
    if (!user.IsActive)
        return Unauthorized(new { message = "User is disabled. Contact admin." });

        var token = GenerateJwt(user);

        return Ok(new
        {
            token,
            role = user.Role,
            email = user.Email
        });
    }

    private string GenerateJwt(User user)
    {
        var claims = new[]
        {

            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(ClaimTypes.Name, user.Email) 
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Key"])
        );

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
public class LoginDto
{
    public string Email { get; set; }
    public string Password { get; set; }
}
