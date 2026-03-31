using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.AppOperatorService.DTO;

public class AppOperatorRouteDescriptorDto
{
    [Required]
    [MaxLength(120)]
    public string Key { get; set; }

    [Required]
    [MaxLength(260)]
    public string Path { get; set; }

    [MaxLength(200)]
    public string Label { get; set; }
}
