using System;
using System.ComponentModel.DataAnnotations;

namespace MosaicTalent.Services.ProjectProgressService.DTO;

public class ReviewProjectProgressEntryInput
{
    public Guid EntryId { get; set; }

    [Required, StringLength(2000, MinimumLength = 5)]
    public string Comment { get; set; }
}
