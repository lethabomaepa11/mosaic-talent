# Swagger file upload metadata (#133)

The upload actions accept file parts alongside a `folder` form field. `IFormFile` already identifies itself as a multipart file binding to ASP.NET Core, so the file parameters must not carry `[FromForm]`. That annotation changes the API Explorer binding metadata and prevents Swashbuckle from generating the OpenAPI document. The `folder` string remains explicitly bound from the form.

Both authenticated and public upload actions use the inferred file binding. Regression tests check that the file parameter has no `[FromForm]` attribute and that the folder parameter retains it. A local host smoke test should confirm `/swagger/v1/swagger.json` returns 200 and includes both upload operations as multipart form data.
