import { cx } from './ui.jsx';

// Arte que se revela: começa em azul de cianótipo e ganha cor conforme `progress` (0 a 1).
export function Revelacao({ src, progress = 0, className, label }) {
  return (
    <figure
      className={cx('rev', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {src ? (
        <>
          <img className="rev__tone" src={src} alt="" />
          <img className="rev__color" src={src} alt="" style={{ opacity: progress }} />
        </>
      ) : (
        <span className="rev__art" style={{ opacity: progress }} />
      )}
      <span className="rev__grain" />
    </figure>
  );
}
