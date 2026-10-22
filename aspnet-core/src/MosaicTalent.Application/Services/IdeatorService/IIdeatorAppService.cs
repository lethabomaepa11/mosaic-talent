using MosaicTalent.Services.IdeatorService.DTO;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MosaicTalent.Services.IdeatorService;

public interface IIdeatorAppService
{
    Task<List<IdeaPostDto>> GetFeed();
    Task<IdeaPostDto> CreateIdea(CreateIdeaPostInput input);
    Task<IdeaPostDto> React(ReactToIdeaInput input);
    Task<IdeaPostDto> Comment(CommentOnIdeaInput input);
    Task<IdeaPostDto> ConvertToProject(ConvertIdeaInput input);
    Task DeleteIdea(Guid ideaPostId);
}
