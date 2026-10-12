using Abp.Auditing;
using Abp.Authorization.Users;
using Abp.Extensions;
using MosaicTalent.Validation;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Authorization.Accounts.Dto;

public class RegisterInput : IValidatableObject
{
    [StringLength(AbpUserBase.MaxNameLength + AbpUserBase.MaxSurnameLength + 1)]
    public string FullName { get; set; }

    [StringLength(AbpUserBase.MaxNameLength)]
    public string Name { get; set; }

    [StringLength(AbpUserBase.MaxSurnameLength)]
    public string Surname { get; set; }

    [StringLength(AbpUserBase.MaxUserNameLength)]
    public string UserName { get; set; }

    [Required]
    [EmailAddress]
    [StringLength(AbpUserBase.MaxEmailAddressLength)]
    public string EmailAddress { get; set; }

    [Required]
    [StringLength(AbpUserBase.MaxPlainPasswordLength)]
    [DisableAuditing]
    public string Password { get; set; }

    [DisableAuditing]
    public string CaptchaResponse { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(FullName))
        {
            if (string.IsNullOrWhiteSpace(Name) || string.IsNullOrWhiteSpace(Surname) || string.IsNullOrWhiteSpace(UserName))
            {
                yield return new ValidationResult("Full name is required.", new[] { nameof(FullName) });
            }
        }
        else
        {
            var names = RegistrationDetails.SplitFullName(FullName);
            if (names.Name.Length > AbpUserBase.MaxNameLength || names.Surname.Length > AbpUserBase.MaxSurnameLength)
            {
                yield return new ValidationResult("Full name is too long.", new[] { nameof(FullName) });
            }
            if (!RegistrationDetails.IsStrongPassword(Password))
            {
                yield return new ValidationResult("Use at least 8 characters, uppercase and lowercase letters, a number, and a symbol.", new[] { nameof(Password) });
            }
        }
        if (!UserName.IsNullOrEmpty())
        {
            if (!UserName.Equals(EmailAddress) && ValidationHelper.IsEmail(UserName))
            {
                yield return new ValidationResult("Username cannot be an email address unless it's the same as your email address!");
            }
        }
    }
}
