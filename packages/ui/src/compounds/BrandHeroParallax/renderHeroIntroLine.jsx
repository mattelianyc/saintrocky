export function renderHeroIntroLine(line, linkClassName = "c-BrandHeroParallax__introLink") {
  if (!line.includes("Wikipedia")) {
    return line;
  }

  const [beforeWikipedia, afterWikipedia] = line.split("Wikipedia");

  return (
    <>
      {beforeWikipedia}
      <a
        href="https://en.wikipedia.org/wiki/Saint_Roch"
        target="_blank"
        rel="noreferrer"
        className={linkClassName}
      >
        Wikipedia
      </a>
      {afterWikipedia}
    </>
  );
}
