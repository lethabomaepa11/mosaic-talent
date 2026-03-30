using MosaicTalent.Domains.Developers;
using MosaicTalent.Domains.Projects;
using System.Threading.Tasks;

namespace MosaicTalent.Services.NotificationChannelService;

public interface IProjectJoinNotificationDispatcher
{
    Task NotifyOwnerAboutJoinAsync(Project project, Developer joinedDeveloper, int tenantId);
}
