using System.Security.Claims;

namespace RentalSystem.Web.Security
{
    public interface IOrganizationProvider
    {
        int? OrganizationId { get; }
    }

    public class OrganizationProvider : IOrganizationProvider
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public OrganizationProvider(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public int? OrganizationId
        {
            get
            {
                var user = _httpContextAccessor.HttpContext?.User;
                if (user == null) return null;

                var claim = user.FindFirst(AuthClaimTypes.OrganizationId);
                if (claim != null && int.TryParse(claim.Value, out var orgId))
                {
                    return orgId;
                }

                return null;
            }
        }
    }
}
