export const updateFavicon = (url: string | null | undefined) => {
  if (typeof document === "undefined" || !url) return;

  const links = document.querySelectorAll("link[rel*='icon']");
  const targetHref = url;
  console.log("target url : ", targetHref)

  if (links.length > 0) {
    links.forEach((link: any) => {
      link.href = targetHref;
    });
  } else {
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = targetHref;
    document.getElementsByTagName("head")[0].appendChild(link);
  }
};
