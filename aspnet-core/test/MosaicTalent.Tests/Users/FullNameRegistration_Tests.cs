using MosaicTalent.Authorization.Accounts;
using MosaicTalent.Authorization.Accounts.Dto;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using Xunit;

namespace MosaicTalent.Tests.Users;

public class FullNameRegistration_Tests : MosaicTalentTestBase
{
    [Theory]
    [InlineData("Jane Doe")]
    [InlineData("Cher")]
    public async Task Should_Register_With_Full_Name_Without_An_Email_Username(string name)
    {
        var email = name == "Cher" ? "cher@example.com" : "jane@example.com";
        var result = await Resolve<IAccountAppService>().Register(new RegisterInput
        {
            FullName = name, EmailAddress = email, Password = "Strong123!",
        });
        result.CanLogin.ShouldBeTrue();
        await UsingDbContextAsync(async context =>
        {
            var user = await context.Users.FirstOrDefaultAsync(x => x.EmailAddress == email);
            user.ShouldNotBeNull();
            (user.Name + " " + user.Surname).Trim().ShouldBe(name);
            user.UserName.ShouldNotContain("@");
        });
    }

    [Theory]
    [InlineData("", "Strong123!")]
    [InlineData("Jane Doe", "weak")]
    [InlineData("Jane Doe", "NoDigit!")]
    public void Should_Reject_Missing_Name_And_Weak_Password(string name, string password)
    {
        var input = new RegisterInput { FullName = name, Password = password, EmailAddress = "jane@example.com" };
        var errors = new List<ValidationResult>();
        Validator.TryValidateObject(input, new ValidationContext(input), errors, true).ShouldBeFalse();
    }
}
