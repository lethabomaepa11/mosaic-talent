using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace MosaicTalent.Files
{
    public interface IR2StorageService
    {
        Task<FileUploadResultDto> UploadAsync(IFormFile file, string folder);
    }
}
