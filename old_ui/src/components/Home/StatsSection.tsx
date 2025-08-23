import CountUp from 'react-countup';

const stats = [
  { value: '1200', label: 'campaigns funded' },
  { value: '56%', label: 'Rasised' },
  { value: '500', label: 'Fundraisers' },
];

const StatsSection = () => {
  return (
    <section className="py-8 md:py-14">
      <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16">
        <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center">
          <h2 className="text-4xl font-semibold font-pt-serif lg:text-5xl">Ib4me in numbers</h2>
          <p className="font-poppins text-muted-foreground">
            Join thousands of people who have successfully funded their medical treatments and
            helped others in need.
          </p>
        </div>
        <div className="grid gap-0.5 *:text-center md:grid-cols-3">
          {stats.map((stat, index) => (
            <div key={index} className="rounded-(--radius) space-y-4 border py-12">
              <div className="text-2xl sm:text-4xl font-bold">
                <CountUp
                  start={0}
                  end={parseFloat(stat.value.replace(/[^\d.-]/g, ''))}
                  duration={5}
                  delay={0}
                />
                +
              </div>
              <p>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
