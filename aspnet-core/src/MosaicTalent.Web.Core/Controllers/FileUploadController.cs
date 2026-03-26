using Abp.AspNetCore.Mvc.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MosaicTalent.Files;
using System.Threading.Tasks;

namespace MosaicTalent.Controllers
{
    [Route("api/files")]
    public class FileUploadController : MosaicTalentControllerBase
    {
        private readonly IR2StorageService _r2StorageService;

        public FileUploadController(IR2StorageService r2StorageService)
        {
            _r2StorageService = r2StorageService;
        }

        [HttpPost("upload")]
        [AbpMvcAuthorize]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<ActionResult<FileUploadResultDto>> Upload([FromForm] IFormFile file, [FromForm] string folder = "general")
        {
            var result = await _r2StorageService.UploadAsync(file, folder);
            return Ok(result);
        }

        [HttpPost("upload-public")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        public async Task<ActionResult<FileUploadResultDto>> UploadPublic([FromForm] IFormFile file, [FromForm] string folder = "public")
        {
            var result = await _r2StorageService.UploadAsync(file, folder);
            return Ok(result);
        }
    }
}
