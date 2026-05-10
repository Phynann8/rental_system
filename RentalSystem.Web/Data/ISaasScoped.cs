namespace RentalSystem.Web.Data
{
    /// <summary>
    /// Interface for entities that belong to a specific SaaS Organization.
    /// Used for automatic data isolation via Global Query Filters.
    /// </summary>
    public interface ISaasScoped
    {
        int OrganizationId { get; set; }
    }
}
