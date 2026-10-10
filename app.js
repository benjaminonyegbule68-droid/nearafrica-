
async function loadBusinessRating(business, element) {
  if (!element || !business) return;

  const businessId = String(
    business.id || business.business_id || business.businessId || ""
  ).trim();

  if (!businessId) {
    element.textContent = "☆☆☆☆☆ No rating (0)";
    return;
  }

  const cached = App.reviewStatsCache[businessId];

  if (cached) {
    renderBusinessRating(cached, element);
    return;
  }

  if (!App.reviewStatsRequests[businessId]) {
    App.reviewStatsRequests[businessId] = (async () => {
      const path =
        "/businesses/" + encodeURIComponent(businessId) + "/reviews";

      const response = await fetch(buildApiUrl(path), {
        method: "GET",
        headers: { Accept: "application/json" }
      });

      if (!response.ok) {
        throw new Error("Reviews request failed: " + response.status);
      }

      const data = await response.json();
      const reviews = Array.isArray(data.reviews) ? data.reviews : [];

      const ratings = reviews
        .map(review => Number(review.rating))
        .filter(rating =>
          Number.isFinite(rating) && rating >= 1 && rating <= 5
        );

      const count = ratings.length;
      const average = count
        ? ratings.reduce((sum, rating) => sum + rating, 0) / count
        : 0;

      const stats = { average, count };

      App.reviewStatsCache[businessId] = stats;
      return stats;
    })();
  }

  try {
    const stats = await App.reviewStatsRequests[businessId];
    renderBusinessRating(stats, element);
  } catch (error) {
    console.error("Could not load business rating:", businessId, error);
    element.textContent = "Rating unavailable";
  } finally {
    delete App.reviewStatsRequests[businessId];
  }
}

function renderBusinessRating(stats, element) {
  if (!element) return;

  const count = Number(stats.count) || 0;
  const average = Number(stats.average) || 0;

  if (count === 0) {
    element.textContent = "☆☆☆☆☆ No rating (0)";
    return;
  }

  const roundedRating = Math.round(average);
  const stars = "★".repeat(roundedRating) +
    "☆".repeat(5 - roundedRating);

  element.textContent =
    stars + " " + average.toFixed(1) + " (" + count + ")";
}
