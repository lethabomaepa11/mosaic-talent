using MosaicTalent.Services.ProjectProgressService.DTO;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MosaicTalent.Services.ProjectProgressService;

public interface IProjectProgressAppService
{
    Task<List<ProjectProgressEntryDto>> GetProjectProgressEntries(Guid projectId);
    Task<ProjectProgressEntryDto> CreateProjectProgressEntry(CreateProjectProgressEntryInput input);
    Task<ProjectProgressEntryDto> ReviewProjectProgressEntry(ReviewProjectProgressEntryInput input);
}
