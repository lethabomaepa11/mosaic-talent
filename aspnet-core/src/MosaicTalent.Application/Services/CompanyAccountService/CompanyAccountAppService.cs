using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Extensions;
using Abp.IdentityFramework;
using Abp.MultiTenancy;
using Abp.UI;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.Authorization.Roles;
using MosaicTalent.Authorization.Users;
using MosaicTalent.Domains.Companies;
using MosaicTalent.Editions;
using MosaicTalent.Services.CompanyAccountService.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace MosaicTalent.Services.CompanyAccountService;

[AbpAuthorize]
public class CompanyAccountAppService : MosaicTalentAppServiceBase, ICompanyAccountAppService
{
    private readonly IRepository<Company, Guid> _companyRepository;
    private readonly IRepository<CompanyEmployee, Guid> _companyEmployeeRepository;
    private readonly EditionManager _editionManager;
    private readonly UserManager _userManager;
    private readonly RoleManager _roleManager;
    private readonly IAbpZeroDbMigrator _abpZeroDbMigrator;

    public CompanyAccountAppService(
        IRepository<Company, Guid> companyRepository,
        IRepository<CompanyEmployee, Guid> companyEmployeeRepository,
        EditionManager editionManager,
        UserManager userManager,
        RoleManager roleManager,
        IAbpZeroDbMigrator abpZeroDbMigrator)
    {
        _companyRepository = companyRepository;
        _companyEmployeeRepository = companyEmployeeRepository;
        _editionManager = editionManager;
        _userManager = userManager;
        _roleManager = roleManager;
        _abpZeroDbMigrator = abpZeroDbMigrator;
    }

    [AbpAllowAnonymous]
    public async Task<CreateCompanyAccountOutput> CreateCompanyAccount(CreateCompanyAccountInput input)
    {
        var tenancyName = BuildTenancyName(input.Name);
        await EnsureTenancyNameAvailable(tenancyName);

        var tenant = new MultiTenancy.Tenant(tenancyName, input.Name)
        {
            IsActive = true,
        };

        var defaultEdition = await _editionManager.FindByNameAsync(EditionManager.DefaultEditionName);
        if (defaultEdition != null)
        {
            tenant.EditionId = defaultEdition.Id;
        }

        await TenantManager.CreateAsync(tenant);
        await CurrentUnitOfWork.SaveChangesAsync();

        _abpZeroDbMigrator.CreateOrMigrateForTenant(tenant);

        using (CurrentUnitOfWork.SetTenantId(tenant.Id))
        {
            CheckErrors(await _roleManager.CreateStaticRoles(tenant.Id));
            await CurrentUnitOfWork.SaveChangesAsync();

            var adminRole = _roleManager.Roles.Single(x => x.Name == StaticRoleNames.Tenants.Admin);
            await _roleManager.GrantAllPermissionsAsync(adminRole);

            var owner = new User
            {
                TenantId = tenant.Id,
                Name = input.AccountOwnerName,
                Surname = input.AccountOwnerSurname,
                UserName = input.AccountOwnerUserName,
                EmailAddress = input.AccountOwnerEmailAddress,
                IsActive = true,
                IsEmailConfirmed = true,
            };

            owner.SetNormalizedNames();

            await _userManager.InitializeOptionsAsync(tenant.Id);
            CheckErrors(await _userManager.CreateAsync(owner, input.AccountOwnerPassword));
            await CurrentUnitOfWork.SaveChangesAsync();

            CheckErrors(await _userManager.AddToRoleAsync(owner, adminRole.Name));
            await CurrentUnitOfWork.SaveChangesAsync();

            var company = new Company
            {
                TenantId = tenant.Id,
                Name = input.Name.Trim(),
                TenancyName = tenancyName,
                LogoStoredFileId = input.LogoStoredFileId?.Trim(),
                Website = input.Website?.Trim(),
                Email = input.Email.Trim(),
                AccountOwnerUserId = owner.Id,
            };

            await _companyRepository.InsertAsync(company);
            await CurrentUnitOfWork.SaveChangesAsync();

            await _companyEmployeeRepository.InsertAsync(new CompanyEmployee
            {
                TenantId = tenant.Id,
                CompanyId = company.Id,
                UserId = owner.Id,
                Role = CompanyRole.Admin,
            });

            await CurrentUnitOfWork.SaveChangesAsync();

            return new CreateCompanyAccountOutput
            {
                CompanyId = company.Id,
                TenantId = tenant.Id,
                TenancyName = tenancyName,
            };
        }
    }

    [AbpAllowAnonymous]
    public async Task<CompanyPublicBrandingDto> GetCompanyBrandingByTenancyName(string tenancyName)
    {
        if (tenancyName.IsNullOrWhiteSpace())
        {
            throw new UserFriendlyException("Tenancy name is required.");
        }

        var normalizedTenancyName = tenancyName.Trim().ToLowerInvariant();
        var company = await _companyRepository.GetAll()
            .FirstOrDefaultAsync(x => x.TenancyName == normalizedTenancyName);

        if (company == null)
        {
            throw new UserFriendlyException("Company not found for this tenancy.");
        }

        return new CompanyPublicBrandingDto
        {
            Name = company.Name,
            TenancyName = company.TenancyName,
            LogoStoredFileId = company.LogoStoredFileId,
            WebsiteUrl = company.Website,
        };
    }

    public async Task<CompanyDto> GetMyCompany()
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var company = await _companyRepository.GetAll().FirstOrDefaultAsync(x => x.TenantId == tenantId);

        if (company == null)
        {
            throw new UserFriendlyException("Company account was not found for this tenant.");
        }

        return MapCompany(company);
    }

    public async Task<CompanyDto> UpdateMyCompany(UpdateMyCompanyInput input)
    {
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var company = await GetCompanyEntity(tenantId);
        await EnsureIsCompanyAdmin(company.Id, userId);

        company.Name = input.Name?.Trim();
        company.LogoStoredFileId = input.LogoStoredFileId?.Trim();
        company.Website = input.Website?.Trim();
        company.Email = input.Email?.Trim();

        await _companyRepository.UpdateAsync(company);
        await CurrentUnitOfWork.SaveChangesAsync();
        return MapCompany(company);
    }

    public async Task<List<CompanyEmployeeDto>> GetMyCompanyEmployees()
    {
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var company = await GetCompanyEntity(tenantId);
        var employees = await _companyEmployeeRepository.GetAll()
            .Where(x => x.CompanyId == company.Id)
            .ToListAsync();

        var userIds = employees.Select(x => x.UserId).Distinct().ToList();
        var users = await _userManager.Users
            .Where(x => x.TenantId == tenantId && userIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x);

        return employees
            .OrderByDescending(x => x.Role == CompanyRole.Admin)
            .ThenBy(x => x.CreationTime)
            .Select(x =>
            {
                users.TryGetValue(x.UserId, out var user);
                return new CompanyEmployeeDto
                {
                    Id = x.Id,
                    CompanyId = x.CompanyId,
                    UserId = x.UserId,
                    Role = x.Role,
                    Name = user?.Name,
                    Surname = user?.Surname,
                    EmailAddress = user?.EmailAddress,
                    UserName = user?.UserName,
                    AvatarUrl = ResolveAvatarUrl(user),
                };
            })
            .ToList();
    }

    public async Task<CompanyEmployeeDto> AddCompanyEmployee(AddCompanyEmployeeInput input)
    {
        var currentUserId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");

        var company = await GetCompanyEntity(tenantId);
        await EnsureIsCompanyAdmin(company.Id, currentUserId);

        var existingUserByName = await _userManager.FindByNameAsync(input.UserName);
        if (existingUserByName != null && existingUserByName.TenantId == tenantId)
        {
            throw new UserFriendlyException($"A user with username '{input.UserName}' already exists.");
        }

        var existingUserByEmail = await _userManager.FindByEmailAsync(input.EmailAddress);
        if (existingUserByEmail != null && existingUserByEmail.TenantId == tenantId)
        {
            throw new UserFriendlyException($"A user with email '{input.EmailAddress}' already exists.");
        }

        var user = new User
        {
            TenantId = tenantId,
            Name = input.Name,
            Surname = input.Surname,
            UserName = input.UserName,
            EmailAddress = input.EmailAddress,
            IsActive = true,
            IsEmailConfirmed = true,
        };

        user.SetNormalizedNames();
        await _userManager.InitializeOptionsAsync(tenantId);
        CheckErrors(await _userManager.CreateAsync(user, input.Password));
        await CurrentUnitOfWork.SaveChangesAsync();

        if (input.Role == CompanyRole.Admin)
        {
            CheckErrors(await _userManager.AddToRoleAsync(user, StaticRoleNames.Tenants.Admin));
            await CurrentUnitOfWork.SaveChangesAsync();
        }

        var employee = new CompanyEmployee
        {
            TenantId = tenantId,
            CompanyId = company.Id,
            UserId = user.Id,
            Role = input.Role,
        };
        await _companyEmployeeRepository.InsertAsync(employee);
        await CurrentUnitOfWork.SaveChangesAsync();

        return new CompanyEmployeeDto
        {
            Id = employee.Id,
            CompanyId = employee.CompanyId,
            UserId = employee.UserId,
            Role = employee.Role,
            Name = user.Name,
            Surname = user.Surname,
            EmailAddress = user.EmailAddress,
            UserName = user.UserName,
            AvatarUrl = ResolveAvatarUrl(user),
        };
    }

    public async Task<CompanyEmployeeDto> UpdateEmployeeRole(UpdateCompanyEmployeeRoleInput input)
    {
        var currentUserId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var company = await GetCompanyEntity(tenantId);

        await EnsureIsCompanyAdmin(company.Id, currentUserId);

        var employee = await _companyEmployeeRepository.GetAll()
            .FirstOrDefaultAsync(x => x.Id == input.CompanyEmployeeId && x.CompanyId == company.Id);
        if (employee == null)
        {
            throw new UserFriendlyException("Company employee not found.");
        }

        employee.Role = input.Role;
        await _companyEmployeeRepository.UpdateAsync(employee);
        await CurrentUnitOfWork.SaveChangesAsync();

        var user = await _userManager.Users
            .Where(x => x.TenantId == tenantId && x.Id == employee.UserId)
            .FirstOrDefaultAsync();

        if (user != null)
        {
            if (input.Role == CompanyRole.Admin)
            {
                CheckErrors(await _userManager.AddToRoleAsync(user, StaticRoleNames.Tenants.Admin));
            }
            else if (await _userManager.IsInRoleAsync(user, StaticRoleNames.Tenants.Admin))
            {
                CheckErrors(await _userManager.RemoveFromRoleAsync(user, StaticRoleNames.Tenants.Admin));
            }
        }

        return new CompanyEmployeeDto
        {
            Id = employee.Id,
            CompanyId = employee.CompanyId,
            UserId = employee.UserId,
            Role = employee.Role,
            Name = user?.Name,
            Surname = user?.Surname,
            EmailAddress = user?.EmailAddress,
            UserName = user?.UserName,
            AvatarUrl = ResolveAvatarUrl(user),
        };
    }

    public async Task<CompanyEmployeeProfileDto> GetMyEmployeeProfile()
    {
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var company = await GetCompanyEntity(tenantId);

        var employee = await _companyEmployeeRepository.GetAll()
            .FirstOrDefaultAsync(x => x.CompanyId == company.Id && x.UserId == userId);
        if (employee == null)
        {
            throw new UserFriendlyException("Company employee profile not found.");
        }

        var user = await _userManager.Users
            .Where(x => x.TenantId == tenantId && x.Id == userId)
            .FirstOrDefaultAsync()
            ?? throw new UserFriendlyException("User not found.");

        return new CompanyEmployeeProfileDto
        {
            UserId = user.Id,
            Name = user.Name,
            Surname = user.Surname,
            UserName = user.UserName,
            EmailAddress = user.EmailAddress,
            AvatarUrl = ResolveAvatarUrl(user),
            Role = employee.Role,
        };
    }

    public async Task<CompanyEmployeeProfileDto> UpdateMyEmployeeProfile(UpdateCompanyEmployeeProfileInput input)
    {
        var userId = AbpSession.UserId ?? throw new UserFriendlyException("User must be logged in.");
        var tenantId = AbpSession.TenantId ?? throw new UserFriendlyException("Tenant context is required.");
        var company = await GetCompanyEntity(tenantId);

        var employee = await _companyEmployeeRepository.GetAll()
            .FirstOrDefaultAsync(x => x.CompanyId == company.Id && x.UserId == userId);
        if (employee == null)
        {
            throw new UserFriendlyException("Company employee profile not found.");
        }

        var user = await _userManager.Users
            .Where(x => x.TenantId == tenantId && x.Id == userId)
            .FirstOrDefaultAsync()
            ?? throw new UserFriendlyException("User not found.");

        if (!string.IsNullOrWhiteSpace(input.Name))
        {
            user.Name = input.Name.Trim();
        }

        if (!string.IsNullOrWhiteSpace(input.Surname))
        {
            user.Surname = input.Surname.Trim();
        }

        user.AvatarUrl = input.AvatarUrl?.Trim();

        CheckErrors(await _userManager.UpdateAsync(user));
        await CurrentUnitOfWork.SaveChangesAsync();

        return new CompanyEmployeeProfileDto
        {
            UserId = user.Id,
            Name = user.Name,
            Surname = user.Surname,
            UserName = user.UserName,
            EmailAddress = user.EmailAddress,
            AvatarUrl = ResolveAvatarUrl(user),
            Role = employee.Role,
        };
    }

    private static string BuildTenancyName(string companyName)
    {
        var cleaned = (companyName ?? string.Empty).Trim().ToLowerInvariant();
        var sb = new StringBuilder();
        var lastWasDash = false;

        foreach (var ch in cleaned)
        {
            if (char.IsLetterOrDigit(ch))
            {
                sb.Append(ch);
                lastWasDash = false;
                continue;
            }

            if (lastWasDash)
            {
                continue;
            }

            sb.Append("-");
            lastWasDash = true;
        }

        var tenancyName = sb.ToString().Trim('-');
        tenancyName = Regex.Replace(tenancyName, "-{2,}", "-");

        if (tenancyName.Length < 2)
        {
            throw new UserFriendlyException("Company name cannot be converted into a valid tenancy name.");
        }

        if (tenancyName.Length > AbpTenantBase.MaxTenancyNameLength)
        {
            tenancyName = tenancyName.Substring(0, AbpTenantBase.MaxTenancyNameLength);
        }

        if (!Regex.IsMatch(tenancyName, AbpTenantBase.TenancyNameRegex))
        {
            throw new UserFriendlyException("Generated tenancy name is invalid.");
        }

        return tenancyName;
    }

    private async Task EnsureTenancyNameAvailable(string tenancyName)
    {
        var existingTenant = await TenantManager.FindByTenancyNameAsync(tenancyName);
        if (existingTenant != null)
        {
            throw new UserFriendlyException($"Tenant '{tenancyName}' already exists.");
        }
    }

    private async Task<Company> GetCompanyEntity(int tenantId)
    {
        var company = await _companyRepository.GetAll().FirstOrDefaultAsync(x => x.TenantId == tenantId);
        if (company == null)
        {
            throw new UserFriendlyException("Company account was not found for this tenant.");
        }

        return company;
    }

    private async Task EnsureIsCompanyAdmin(Guid companyId, long userId)
    {
        var isAdmin = await _companyEmployeeRepository.GetAll()
            .AnyAsync(x => x.CompanyId == companyId && x.UserId == userId && x.Role == CompanyRole.Admin);

        if (!isAdmin)
        {
            throw new AbpAuthorizationException("Only company admins can perform this action.");
        }
    }

    private static CompanyDto MapCompany(Company company)
    {
        return new CompanyDto
        {
            Id = company.Id,
            Name = company.Name,
            TenancyName = company.TenancyName,
            LogoStoredFileId = company.LogoStoredFileId,
            Website = company.Website,
            Email = company.Email,
            AccountOwnerUserId = company.AccountOwnerUserId,
        };
    }

    private static string ResolveAvatarUrl(User user)
    {
        if (!string.IsNullOrWhiteSpace(user?.AvatarUrl))
        {
            return user.AvatarUrl;
        }

        if (user == null)
        {
            return string.Empty;
        }

        var displayName = string.Join(" ", new[] { user.Name, user.Surname }.Where(x => !string.IsNullOrWhiteSpace(x)));
        if (string.IsNullOrWhiteSpace(displayName))
        {
            displayName = user.UserName;
        }

        if (string.IsNullOrWhiteSpace(displayName))
        {
            return string.Empty;
        }

        return $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(displayName)}&background=random";
    }
}
