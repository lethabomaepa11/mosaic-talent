using MosaicTalent.Services.DeveloperProjectService.DTO;
using Shouldly;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Xunit;

namespace MosaicTalent.Tests.Services.DeveloperProjectService;

public class CreateDeveloperProjectInput_Tests
{
    [Fact]
    public void Allows_a_project_without_a_GitHub_repository()
    {
        var input = new CreateDeveloperProjectInput
        {
            Title = "Study Group",
            Description = "A project that does not need a repository.",
            GithubRepo = null,
        };
        var results = new List<ValidationResult>();

        var isValid = Validator.TryValidateObject(input, new ValidationContext(input), results, validateAllProperties: true);

        isValid.ShouldBeTrue(string.Join("; ", results));
    }
}
