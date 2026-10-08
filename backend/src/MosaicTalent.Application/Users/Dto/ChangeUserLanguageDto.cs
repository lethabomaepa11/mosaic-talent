using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Users.Dto;

public class ChangeUserLanguageDto
{
    [Required]
    public string LanguageName { get; set; }
}