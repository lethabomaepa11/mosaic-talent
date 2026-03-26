using MosaicTalent.Domains.Companies;

namespace MosaicTalent.Services.CompanyAccountService.DTO;

public class CompanyEmployeeProfileDto
{
    public long UserId { get; set; }
    public string Name { get; set; }
    public string Surname { get; set; }
    public string UserName { get; set; }
    public string EmailAddress { get; set; }
    public string AvatarUrl { get; set; }
    public CompanyRole Role { get; set; }
}
