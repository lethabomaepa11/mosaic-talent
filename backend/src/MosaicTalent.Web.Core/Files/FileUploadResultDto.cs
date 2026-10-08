namespace MosaicTalent.Files
{
    public class FileUploadResultDto
    {
        public string FileId { get; set; }

        public string Key { get; set; }

        public string Url { get; set; }

        public string ContentType { get; set; }

        public long Size { get; set; }
    }
}
