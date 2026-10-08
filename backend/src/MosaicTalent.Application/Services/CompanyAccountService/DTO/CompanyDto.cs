using System;

namespace MosaicTalent.Services.CompanyAccountService.DTO;

public class CompanyDto
{
    public Guid Id { get; set; }

    public string Name { get; set; }

    public string TenancyName { get; set; }

    public string LogoStoredFileId { get; set; }

    public string Website { get; set; }

    public string Email { get; set; }

    public long AccountOwnerUserId { get; set; }
}
