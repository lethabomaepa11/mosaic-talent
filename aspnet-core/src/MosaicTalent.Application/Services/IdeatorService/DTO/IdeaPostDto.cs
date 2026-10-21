using System;
using System.Collections.Generic;

namespace MosaicTalent.Services.IdeatorService.DTO;

public class IdeaPostDto
{
    public Guid Id { get; set; }
    public Guid CreatorDeveloperId { get; set; }
    public string CreatorName { get; set; }
    public string Title { get; set; }
    public string ProblemStatement { get; set; }
    public string ProposedSolution { get; set; }
    public DateTime CreatedAt { get; set; }
    public string MyReaction { get; set; }
    public int InterestedCount { get; set; }
    public int LikeCount { get; set; }
    public int DislikeCount { get; set; }
    public int CommentCount { get; set; }
    public bool IsOwner { get; set; }
    public bool IsPublic { get; set; }
    public bool IsConverted { get; set; }
    public Guid? ConvertedProjectId { get; set; }
    public List<IdeaCommentDto> Comments { get; set; } = new();
}

public class IdeaCommentDto
{
    public Guid Id { get; set; }
    public Guid AuthorDeveloperId { get; set; }
    public string AuthorName { get; set; }
    public string Body { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateIdeaPostInput
{
    public string Title { get; set; }
    public string ProblemStatement { get; set; }
    public string ProposedSolution { get; set; }
    public bool? IsPublic { get; set; }
}

public class ReactToIdeaInput { public Guid IdeaPostId { get; set; } public string Type { get; set; } }
public class CommentOnIdeaInput { public Guid IdeaPostId { get; set; } public string Body { get; set; } }
public class ConvertIdeaInput { public Guid IdeaPostId { get; set; } public bool InviteInterestedDevelopers { get; set; } }
