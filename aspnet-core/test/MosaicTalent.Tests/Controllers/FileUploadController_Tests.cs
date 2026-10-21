using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MosaicTalent.Controllers;
using System.Linq;
using Xunit;

namespace MosaicTalent.Tests.Controllers;

public class FileUploadController_Tests
{
    [Theory]
    [InlineData("Upload")]
    [InlineData("UploadPublic")]
    public void File_parameters_use_inferred_file_binding(string actionName)
    {
        var action = typeof(FileUploadController).GetMethod(actionName);
        var fileParameter = action.GetParameters().Single(parameter => parameter.ParameterType == typeof(IFormFile));

        Assert.Empty(fileParameter.GetCustomAttributes(typeof(FromFormAttribute), inherit: false));
    }

    [Theory]
    [InlineData("Upload")]
    [InlineData("UploadPublic")]
    public void Folder_parameters_remain_bound_from_form(string actionName)
    {
        var action = typeof(FileUploadController).GetMethod(actionName);
        var folderParameter = action.GetParameters().Single(parameter => parameter.Name == "folder");

        Assert.NotEmpty(folderParameter.GetCustomAttributes(typeof(FromFormAttribute), inherit: false));
    }
}
