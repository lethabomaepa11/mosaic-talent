using Abp.UI;
using Abp.Dependency;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace MosaicTalent.Files
{
    public class R2StorageService : IR2StorageService, ITransientDependency
    {
        private const long MaxUploadSize = 10 * 1024 * 1024;
        private static readonly string[] AllowedContentTypes =
        {
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "application/octet-stream",
        };
        private static readonly string[] AllowedExtensions =
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
            ".gif",
            ".pdf",
            ".doc",
            ".docx",
            ".txt",
        };

        private readonly R2StorageOptions _options;
        private readonly IAmazonS3 _s3Client;

        public R2StorageService(IConfiguration configuration)
        {
            _options = new R2StorageOptions
            {
                AccountId = configuration["R2:AccountId"],
                AccessKeyId = configuration["R2:AccessKeyId"],
                SecretAccessKey = configuration["R2:SecretAccessKey"],
                BucketName = configuration["R2:BucketName"],
                PublicBaseUrl = configuration["R2:PublicBaseUrl"],
            };

            ValidateConfiguration(_options);

            var config = new AmazonS3Config
            {
                ServiceURL = string.Format("https://{0}.r2.cloudflarestorage.com", _options.AccountId),
                ForcePathStyle = true,
                SignatureVersion = "4",
            };

            _s3Client = new AmazonS3Client(_options.AccessKeyId, _options.SecretAccessKey, config);
        }

        public async Task<FileUploadResultDto> UploadAsync(IFormFile file, string folder)
        {
            if (file == null || file.Length == 0)
            {
                throw new UserFriendlyException("No file was uploaded.");
            }

            if (file.Length > MaxUploadSize)
            {
                throw new UserFriendlyException("File size exceeds the 10MB upload limit.");
            }

            var extension = (Path.GetExtension(file.FileName) ?? string.Empty).ToLowerInvariant();
            var allowedByContentType = AllowedContentTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase);
            var allowedByExtension = AllowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase);

            if (!allowedByContentType && !allowedByExtension)
            {
                throw new UserFriendlyException("Unsupported file type. Allowed types: images, pdf, doc, docx, txt.");
            }

            var safeFolder = string.IsNullOrWhiteSpace(folder) ? "general" : folder.Trim().ToLowerInvariant();
            var fileId = Guid.NewGuid().ToString("N");
            var key = string.Format("{0}/{1}{2}", safeFolder, fileId, extension);

            using (var stream = file.OpenReadStream())
            {
                var request = new PutObjectRequest
                {
                    BucketName = _options.BucketName,
                    Key = key,
                    InputStream = stream,
                    ContentType = file.ContentType,
                    AutoCloseStream = false,
                    DisablePayloadSigning = true,
                    UseChunkEncoding = false,
                };

                await _s3Client.PutObjectAsync(request);
            }

            return new FileUploadResultDto
            {
                FileId = fileId,
                Key = key,
                Url = BuildPublicUrl(key),
                ContentType = file.ContentType,
                Size = file.Length,
            };
        }

        private string BuildPublicUrl(string key)
        {
            if (!string.IsNullOrWhiteSpace(_options.PublicBaseUrl))
            {
                return string.Format("{0}/{1}", _options.PublicBaseUrl.TrimEnd('/'), key);
            }

            return string.Format(
                "https://{0}.r2.cloudflarestorage.com/{1}/{2}",
                _options.AccountId,
                _options.BucketName,
                key);
        }

        private static void ValidateConfiguration(R2StorageOptions options)
        {
            if (string.IsNullOrWhiteSpace(options.AccountId) ||
                string.IsNullOrWhiteSpace(options.AccessKeyId) ||
                string.IsNullOrWhiteSpace(options.SecretAccessKey) ||
                string.IsNullOrWhiteSpace(options.BucketName))
            {
                throw new UserFriendlyException(
                    "Cloudflare R2 is not configured. Set R2:AccountId, R2:AccessKeyId, R2:SecretAccessKey, and R2:BucketName.");
            }
        }
    }

}
